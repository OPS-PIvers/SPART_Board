with open("components/widgets/Breathing/BreathingVisuals.tsx", "r") as f:
    content = f.read()

lotus_case = """      case 'lotus':
        const numPetals = 8;
        return (
          <div className="relative flex items-center justify-center w-full h-full max-w-[min(80vw,80vh)] max-h-[min(80vw,80vh)]" style={{ aspectRatio: '1/1' }}>
            {Array.from({ length: numPetals }).map((_, i) => {
              const rotation = (360 / numPetals) * i;
              const expansion = isActive ? (scale - 0.5) * 2 : 0; // 0 to 1
              return (
                <div
                  key={i}
                  className="absolute w-[15%] h-[40%] rounded-full transition-all ease-linear origin-bottom mix-blend-multiply opacity-80"
                  style={{
                    backgroundColor: color,
                    transform: `rotate(${rotation + (expansion * 45)}deg) translateY(-${10 + (expansion * 30)}%) scaleY(${0.8 + (expansion * 0.4)})`,
                    transitionDuration: '50ms'
                  }}
                />
              );
            })}
            <div
              className="absolute w-[25%] h-[25%] rounded-full transition-transform ease-linear z-10"
              style={{
                backgroundColor: `${color}ee`,
                transform: `scale(${scale})`,
                transitionDuration: '50ms'
              }}
            />
          </div>
        );"""

lotus_case_fixed = """      case 'lotus': {
        const numPetals = 8;
        return (
          <div className="relative flex items-center justify-center w-full h-full max-w-[min(80vw,80vh)] max-h-[min(80vw,80vh)]" style={{ aspectRatio: '1/1' }}>
            {Array.from({ length: numPetals }).map((_, i) => {
              const rotation = (360 / numPetals) * i;
              const expansion = isActive ? (scale - 0.5) * 2 : 0; // 0 to 1
              return (
                <div
                  key={i}
                  className="absolute w-[15%] h-[40%] rounded-full transition-all ease-linear origin-bottom mix-blend-multiply opacity-80"
                  style={{
                    backgroundColor: color,
                    transform: `rotate(${rotation + (expansion * 45)}deg) translateY(-${10 + (expansion * 30)}%) scaleY(${0.8 + (expansion * 0.4)})`,
                    transitionDuration: '50ms'
                  }}
                />
              );
            })}
            <div
              className="absolute w-[25%] h-[25%] rounded-full transition-transform ease-linear z-10"
              style={{
                backgroundColor: `${color}ee`,
                transform: `scale(${scale})`,
                transitionDuration: '50ms'
              }}
            />
          </div>
        );
      }"""

content = content.replace(lotus_case, lotus_case_fixed)
with open("components/widgets/Breathing/BreathingVisuals.tsx", "w") as f:
    f.write(content)
