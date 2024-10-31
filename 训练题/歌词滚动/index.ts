interface ILyric {
  time: number;
  content: string;
}
const lyric: ILyric[] = [];
const lyricNum = 20;
const totalTime = lyricNum * 5;
const base = 6;
for (let i = 0; i < lyricNum; i++) {
  lyric.push({
    time: i * 5,
    content: `我是第${i * 5}秒,请高亮我`,
  });
}
const lyricContent = document.querySelector("ul");

if (lyricContent) {
  for (let i = 0; i < lyric.length; i++) {
    const element = lyric[i];
    const li = document.createElement("li");
    li.innerText = element.content;
    li.className = "lyric";
    li.setAttribute("data-time", element.time.toString());
    li.setAttribute("data-index", i.toString());
    lyricContent.appendChild(li);
  }
}

window.addEventListener("DOMContentLoaded", function () {
  let curTime = 0;
  let prevLyricElement: HTMLElement | null = null;
  let timer: null | number = null;
  function grapAllLyricElement(): NodeListOf<HTMLElement> {
    return document.querySelectorAll(".lyric");
  }
  function caculateLightLyric(): HTMLElement | null {
    const lyricElements = grapAllLyricElement();
    let curLyricElement: HTMLElement | null = null;
    for (let i = 0; i < lyricElements.length; i++) {
      const element = lyricElements[i];
      if (curTime >= Number(element.dataset.time)) {
        curLyricElement = element;
      }
    }
    return curLyricElement;
  }
  function lightLyric() {
    curTime++;
    const curLightLyric = caculateLightLyric();
    if (curLightLyric && prevLyricElement != curLightLyric) {
      const index = curLightLyric.dataset.index;
      if (prevLyricElement) prevLyricElement.classList.remove("light");
      curLightLyric.classList.add("light");
      prevLyricElement = curLightLyric;

      if (lyricContent && (Number(index) >= base || Number(index) <= 9))
        lyricContent.style.transform = `translateY(-${
          (Number(index) - base) * 30
        }px)`;
    }

    if (curTime >= totalTime && timer) clearInterval(timer);
  }
  timer = setInterval(lightLyric, 300);
});
