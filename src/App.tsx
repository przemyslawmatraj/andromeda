import "./App.css";
import { useRef } from "react";
import { useAnimationAndSmoothScroll } from "./hooks/useAnimationAndSmoothScroll";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const { loading } = useAnimationAndSmoothScroll({
    animation: {
      frame: 0,
      frameCount: 100,
    },
    sqeuence: (index: number) =>
      `./churchSequence/${(index + 1).toString()}.jpg`,
    smoothEnabled: true,
    smoothness: 2,
    canvasRef,
    contentRef,
    gsapCallback: (animation, render, g) => {
      g.to(animation, {
        frame: animation.frameCount - 1,
        snap: "frame",
        ease: "none",
        scrollTrigger: {
          pin: "canvas",
          scrub: 0.5,
          end: () => "500%",
        },
        onUpdate: render,
      });
    },
  });

  return (
    <div id="viewport">
      <div ref={contentRef}>
        {loading && (
          <>
            <img
              src="https://media.tenor.com/guhB4PpjrmUAAAAC/loading-loading-gif.gif"
              style={{
                width: "40px",
                height: "40px",
              }}
            />
            Loading images...
          </>
        )}
        <canvas className="canvas" ref={canvasRef}></canvas>
      </div>
    </div>
  );
}

export default App;
