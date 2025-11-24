const setDefault =(circles) => {

    circles.forEach(function (item) {
      let circle_1 = item.children[0];
      let circle_2 = item.children[1];
      circle_1.children[0].style.transitionDuration = '0s';
      circle_2.children[0].style.transitionDuration = '0s';
      circle_1.children[0].style.transitionDelay = '0s';
      circle_2.children[0].style.transitionDelay = '0s';
      circle_1.children[0].style.transform = "rotateZ(180deg)";
      circle_2.children[0].style.transform = "rotateZ(180deg)";

    })
  }

const build = (circles) =>{
    setDefault(circles);
    setTimeout(function () {

      circles.forEach(function (item) {
        let percent = item.dataset.percent;
        let circle_1 = item.children[0];
        let circle_2 = item.children[1];
        circle_1.children[0].removeAttribute("style");
        circle_2.children[0].removeAttribute("style");
        if (percent > 50) {
          if (percent === 100) {
            circle_1.children[0].style.transform = "rotateZ(0deg)";
            circle_2.children[0].style.transform = "rotateZ(0deg)";
          } else {
            circle_1.children[0].style.transform = "rotateZ(0deg)";
            let percentMore = percent - 50;
            let deg = 180 - (360 * (percentMore / 100));
            circle_2.children[0].style.transform = "rotateZ(" + deg + "deg)";
          }

        } else {
          let deg = 180 - (360 * (percent / 100));
          circle_1.children[0].style.transform = "rotateZ(" + deg + "deg)";
        }

        if(percent === 100){
          circle_1.children[0].classList.add('full');
          // console.log(circle_1.children[0]);
        }else if(percent > 50){
          circle_1.children[0].classList.add('half');
        }else if(percent < 50){
          circle_1.children[0].classList.add('less');
        }

      })
    }, 300)
  }

exports.setProgress = () =>{
  let circles = document.querySelectorAll('.circleProcess');
  build(circles);
}