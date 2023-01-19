import { MutableRefObject, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export interface IUseAnimationAndSmoothScroll {
  animation: {
    frame: number;
    frameCount: number;
  };
  sqeuence: (index: number) => string;
  smoothness?: number;
  smoothEnabled?: boolean;
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
  contentRef: MutableRefObject<HTMLDivElement | null>;
  gsapCallback: (
    animation: {
      frame: number;
      frameCount: number;
    },
    render: () => void,
    g: any
  ) => void;
}

export const useAnimationAndSmoothScroll = ({
  animation,
  sqeuence,
  canvasRef,
  contentRef,
  gsapCallback,
  smoothness = 2,
  smoothEnabled = true,
}: IUseAnimationAndSmoothScroll) => {
  const [loading, setLoading] = useState(true);
  const images: HTMLImageElement[] = [];
  const currentFrame = (index: number) => sqeuence(index);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const context = canvas.getContext("2d");

      const render = () => {
        if (context) {
          context.canvas.width = images[0].width;
          context.canvas.height = images[0].height;
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(images[animation.frame], 0, 0);
        }
      };

      new Promise((resolve) => {
        try {
          for (let i = 0; i < animation.frameCount; i++) {
            const img = new Image();
            img.src = currentFrame(i);
            images.push(img);
          }
          console.log(images);
          images[images.length - 1].onload = () => {
            render();
            resolve(true);
          };
        } catch (error) {
          console.log(error);
        }
      }).then(() => {
        setLoading(false);
        gsap.registerPlugin(ScrollTrigger);

        if (contentRef.current && smoothEnabled) {
          smoothScroll(contentRef.current);
        }

        function smoothScroll(content: any) {
          content = gsap.utils.toArray(content)[0];

          gsap.set(content.parentNode, {
            overflow: "hidden",
            position: "fixed",
            height: "100%",
            width: "100%",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          });
          gsap.set(content, { overflow: "visible", width: "100%" });

          let getProp = gsap.getProperty(content),
            setProp = gsap.quickSetter(content, "y", "px"),
            setScroll = ScrollTrigger.getScrollFunc(window),
            removeScroll = () => (content.style.overflow = "visible"),
            killScrub = (trigger: any) => {
              let scrub = trigger.getTween
                ? trigger.getTween()
                : gsap.getTweensOf(trigger.animation)[0]; // getTween() was added in 3.6.2
              scrub && scrub.pause();
              trigger.animation.progress(trigger.progress);
            },
            height: number,
            isProxyScrolling: boolean;

          function refreshHeight() {
            height = content.clientHeight;
            content.style.overflow = "visible";
            document.body.style.height = height + "px";
            return height - document.documentElement.clientHeight;
          }

          ScrollTrigger.addEventListener("refresh", () => {
            removeScroll();
            requestAnimationFrame(removeScroll);
          });
          ScrollTrigger.defaults({ scroller: content });
          ScrollTrigger.prototype.update = (p) => p; // works around an issue in ScrollTrigger 3.6.1 and earlier (fixed in 3.6.2, so this line could be deleted if you're using 3.6.2 or later)

          ScrollTrigger.scrollerProxy(content, {
            scrollTop(value) {
              if (arguments.length && value) {
                isProxyScrolling = true; // otherwise, if snapping was applied (or anything that attempted to SET the scroll proxy's scroll position), we'd set the scroll here which would then (on the next tick) update the content tween/ScrollTrigger which would try to smoothly animate to that new value, thus the scrub tween would impede the progress. So we use this flag to respond accordingly in the ScrollTrigger's onUpdate and effectively force the scrub to its end immediately.
                setProp(-value);
                setScroll(value);
                return;
              }
              return -getProp("y");
            },
            scrollHeight: () => document.body.scrollHeight,
            getBoundingClientRect() {
              return {
                top: 0,
                left: 0,
                width: window.innerWidth,
                height: window.innerHeight,
              };
            },
          });

          return ScrollTrigger.create({
            animation: gsap.fromTo(
              content,
              { y: 0 },
              {
                y: () => document.documentElement.clientHeight - height,
                ease: "none",
                onUpdate: ScrollTrigger.update,
              }
            ),
            scroller: window,
            invalidateOnRefresh: true,
            start: 0,
            end: refreshHeight,
            refreshPriority: -999,
            scrub: smoothness,
            onUpdate: (self) => {
              if (isProxyScrolling) {
                killScrub(self);
                isProxyScrolling = false;
              }
            },
            onRefresh: killScrub, // when the screen resizes, we just want the animation to immediately go to the appropriate spot rather than animating there, so basically kill the scrub.
          });
        }

        // this is the helper function that sets it all up. Pass in the content <div> and then the wrapping viewport <div> (can be the elements or selector text). It also sets the default "scroller" to the content so you don't have to do that on all your ScrollTriggers.
        const g = gsap;
        gsapCallback(animation, render, g);
      });
    }
  }, []);

  return { loading };
};
