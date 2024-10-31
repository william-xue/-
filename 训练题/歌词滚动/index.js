var lyric = [];
var lyricNum = 20;
var totalTime = lyricNum * 5;
var base = 6;
for (var i = 0; i < lyricNum; i++) {
    lyric.push({
        time: i * 5,
        content: "\u6211\u662F\u7B2C".concat(i * 5, "\u79D2,\u8BF7\u9AD8\u4EAE\u6211"),
    });
}
var lyricContent = document.querySelector("ul");
if (lyricContent) {
    for (var i = 0; i < lyric.length; i++) {
        var element = lyric[i];
        var li = document.createElement("li");
        li.innerText = element.content;
        li.className = "lyric";
        li.setAttribute("data-time", element.time.toString());
        li.setAttribute("data-index", i.toString());
        lyricContent.appendChild(li);
    }
}
window.addEventListener("DOMContentLoaded", function () {
    var curTime = 0;
    var prevLyricElement = null;
    var timer = null;
    function grapAllLyricElement() {
        return document.querySelectorAll(".lyric");
    }
    function caculateLightLyric() {
        var lyricElements = grapAllLyricElement();
        var curLyricElement = null;
        for (var i = 0; i < lyricElements.length; i++) {
            var element = lyricElements[i];
            if (curTime >= Number(element.dataset.time)) {
                curLyricElement = element;
            }
        }
        return curLyricElement;
    }
    function lightLyric() {
        curTime++;
        var curLightLyric = caculateLightLyric();
        if (curLightLyric && prevLyricElement != curLightLyric) {
            var index = curLightLyric.dataset.index;
            if (prevLyricElement)
                prevLyricElement.classList.remove("light");
            curLightLyric.classList.add("light");
            prevLyricElement = curLightLyric;
            if (lyricContent && (Number(index) >= base || Number(index) <= 9))
                lyricContent.style.transform = "translateY(-".concat((Number(index) - base) * 30, "px)");
        }
        if (curTime >= totalTime && timer)
            clearInterval(timer);
    }
    timer = setInterval(lightLyric, 300);
});
