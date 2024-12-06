const views = {
  list: document.getElementById("list-view"),
  blog: document.getElementById("blog")
};

const imageWrappers = [].slice.call(document.getElementsByClassName("img"));
const inners = [].slice.call(document.getElementsByClassName("inner"));

let onTransition = false;

// Util functions
function map(x, in_min, in_max, out_min, out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

// Event Listeners
// onClick add clases before transition
const state = {
  transitionElementIndex: 0
};

// State of List Image transforms
let innersTransforms = Array.prototype.map.call(inners, function(item, i) {
  return {scaleX: 1, scaleY: 1, translateX: -50, translateY: -50};
});

// Maybe use immer because you are mutating on every item change
const updateTransforms = (index, changes) => {
  innersTransforms = innersTransforms.slice();
  innersTransforms[index] = Object.assign({}, innersTransforms[index], changes);
  const transform = innersTransforms[index];
  const transformString = `translate(${transform.translateX}%,${
  transform.translateY
}%) scale(${transform.scaleX},${transform.scaleY})`;
  inners[index].style.transform = transformString;
};

// cacl scale needed to match target dimensions
const calcScale = (itemRect, targetRect) => {
  const scaleX = targetRect.width / itemRect.width;
  const scaleY = targetRect.height / itemRect.height;
  return {x: scaleX, y: scaleY};

};

// Images start at their biggest dimmension for the whole trick to work.
// So to make them fit we need to scale them down.
const calcScales = () => {
  inners.forEach((image, i) => {
      // Only work on initial size because thats what scale uses.
      // Need to find a way to get initial size, nto scaled down size
      const imageRect = image.getBoundingClientRect();

      // Write the original dimensions for later use
      const imageDimensions = {width: imageRect.width, height: imageRect.height};
      const wrapperRect = imageWrappers[i].getBoundingClientRect();
      console.log(i, imageDimensions, wrapperRect.width, wrapperRect.height);
      // Not working because initial dimensions also change!!!
      const scale = calcScale(
          imageDimensions,
          wrapperRect
      );

      const smallestScale = (scale.x > scale.y ? scale.x : scale.y).toFixed(6);
      updateTransforms(i, {scaleX: smallestScale, scaleY: smallestScale});
  });
};

const debouncedCalcScales = _.debounce(calcScales, 200);
calcScales();

// Scroll image Animation (small Y movement)
window.addEventListener("resize", function(e) {
  debouncedCalcScales();
});

// Image movement while touching end(or start) of screen
const maxTranslate = 10;
const translateOnScroll = () => {
  window.requestAnimationFrame(() => {
      // Since immers can be bigger size of wrapper we need calculate it using wrappers
      // And use that to transform inner

      imageWrappers.forEach(function(item, i) {
          const rect = item.getBoundingClientRect();

          const top = Math.min(0, Math.max(-100, rect.top * 100 / rect.height));
          const bot = Math.min(
              100,
              Math.max(0, (rect.bottom - window.innerHeight) * 100 / rect.height)
          );

          let minAbsValue = 0;
          // If bot values are 0 it means the image is inside viewport

          // Always get biggest value
          if (Math.abs(top) > Math.abs(bot)) {
              minAbsValue = top;
          }
          if (Math.abs(bot) > Math.abs(top)) {
              minAbsValue = bot;
          }

          // If image is smaller that viewport
          // Caculate closest percentage.
          // If the image extends to the top and the bot the same height
          // then value will be 0
          if (top !== 0 && bot !== 0) {
              minAbsValue = top + bot;
          }

          // Then map it to a number between MaxTranslate negative and positive
          const mapped = map(
              minAbsValue,
              -100,
              100,
              -maxTranslate,
              maxTranslate
          ).toFixed(6);
          updateTransforms(i, {translateY: -50 + mapped * -1});
      });
  });
};

//place blog in position
const initBlog = () => {
  window.requestAnimationFrame(() => {
      const transitionWrapper = document.getElementById("transition-image");
      const transitionInner = document.getElementById("transition-inner");
      const blogImage = document.getElementById("blog-image");
      const blogInner = document.getElementById("blog-inner");
      const bandLeft = document.getElementById("band-left");
      const bandRight = document.getElementById("band-right");
      const entryContent = document.getElementById("entry-content");
      const entryTitle = document.getElementById("entry-title");
      // Display blog view

      views.blog.classList.remove("hide");
      views.blog.style.display = "block";
      views.blog.style.zIndex = "-1";

      // Reset Everything
      transitionWrapper.style.transform = "";
      transitionWrapper.style.transition = "";
      transitionWrapper.style.opacity = "1";
      transitionWrapper.style.visibility = "visible";

      transitionInner.style.transition = "";

      blogImage.style.opacity = "0";
      blogImage.style.transitionDelay = "";

      bandRight.style.transform = `translateX(100%)`;
      bandLeft.style.transform = `translateX(-100%)`;
      bandRight.style.transition = "";
      bandLeft.style.transition = "";
      bandRight.style.transitionDelay = "";
      bandLeft.style.transitionDelay = "";

      entryTitle.style.transform = ``;
      entryTitle.style.transition = "";

      entryContent.style.opacity = "";
      entryContent.style.transition = "";

      // Make transition-wrapper & transition iamge look exactly the same as the clicked version
      const imageRect = imageWrappers[
    state.transitionElementIndex
  ].getBoundingClientRect();

      transitionWrapper.style.width = `${imageRect.width}px`;
      transitionWrapper.style.height = `${imageRect.height}px`;

      transitionWrapper.style.transform = `translate(${imageRect.left}px,${
    imageRect.top
  }px)`;

      transitionInner.style.transform =
          inners[state.transitionElementIndex].style.transform;
      // and copy src too
      transitionInner.src = inners[state.transitionElementIndex].src;
      blogInner.src = inners[state.transitionElementIndex].src;
  });
};

const animateBlog = () => {
  window.requestAnimationFrame(() => {
      const transitionImage = document.getElementById("transition-image");
      const innerImage = document.getElementById("transition-inner");
      const blogImage = document.getElementById("blog-image");
      const bandLeft = document.getElementById("band-left");
      const bandRight = document.getElementById("band-right");
      const entryTitle = document.getElementById("entry-title");
      const entryContent = document.getElementById("entry-content");

      const rect = transitionImage.getBoundingClientRect();
      const blogRect = blogImage.getBoundingClientRect();

      // Overflow is hidden but scroll mantains for some reason
      // ??? should investigate
      // Move scroll back to top
      document.documentElement.scrollTop = 0;
      // Move wrapper
      // const x = blogRect.left + (blogRect.width / 2) - rect.width/2;
      // const y = blogRect.top + (blogRect.height / 2) - rect.height/2;
      // And position relative to viewport. So top and left are 0

      const x = 0 + blogRect.width / 2 - rect.width / 2;
      // const y = 0 + (blogRect.height / 2) - rect.height/2;
      const y = 0 + blogRect.height / 2 - rect.height / 2;
      // scale its Y-axis to match the blog-image
      const scaleY = blogRect.height / rect.height;
      transitionImage.style.transform = `translate(${x}px,${y}px) scaleY(${scaleY})`;
      // transitionImage.style.transform = `${transitionImage.style.transform} scaleY(${scaleY})`;
      transitionImage.style.transition =
          "transform 1s ease-in-out, opacity 0s ease 1s, visibility 0s ease 1s";

      transitionImage.style.opacity = "0";
      transitionImage.style.visibility = "hidden";

      // The scale of the parent has been reduced(or aumented)
      // So, you have to counteract that by scaling children in the different direction

      const imageScaleY = 100 / scaleY;
      innerImage.style.transform = `translate(-50%,-50%) scale(1, ${imageScaleY *
    0.01})`;

      // I thinkthe counter scaling of children is giving some choppy animation, but seems to work fine i think?

      innerImage.style.transition = "transform 1s ease-in-out";
      blogImage.style.opacity = "1";
      blogImage.style.transitionDelay = "1s";
      // Bands
      // move bands into position
      const bandsTranslate = blogRect.width - (blogRect.width - rect.width) / 2;
      bandRight.style.transform = `translateX(${bandsTranslate}px)`;
      bandLeft.style.transform = `translateX(${-bandsTranslate}px)`;
      bandRight.style.transition = "";
      bandLeft.style.transition = "";

      // Get the title and description from the clicked image's data attributes
      const clickedImage = inners[state.transitionElementIndex];
      const title = clickedImage.dataset.title;
      const description = clickedImage.dataset.description;

      // *** IZMENJENI DEO KODA ***
      entryTitle.innerHTML = title; // Postavlja naslov u entryTitle (<h1> tag)

      const opisKontejner = document.createElement('div'); // Kreira novi <div> element za opis
      opisKontejner.innerHTML = description; // Postavlja opis (<h2> i <p> tagovi) u novi <div>
      entryContent.innerHTML = ''; // Briše prethodni sadržaj iz entryContent
      entryContent.appendChild(opisKontejner); // Dodaje novi <div> element u entryContent
      // *** KRAJ IZMENJENOG DELA KODA ***

      window.requestAnimationFrame(() => {
          // Move bands back with some delay
          bandRight.style.transform = ``;
          bandLeft.style.transform = ``;

          bandRight.style.transition = "transform 1s ease-in-out";
          bandLeft.style.transition = "transform 1s ease-in-out";
          bandRight.style.transitionDelay = "1000ms";
          bandLeft.style.transitionDelay = "1000ms";

          entryTitle.style.transition = "transform 0.5s ease-in-out 2000ms";
          entryTitle.style.transform = `translate(-50%,0%)`;

          entryContent.style.transition = "opacity 0.5s ease-in-out 2500ms";
          entryContent.style.opacity = "1";

          const onOpacityEnd = function(e) {
              if (e.target == this && e.propertyName === "opacity") {
                  this.removeEventListener("transitionend", onOpacityEnd);
                  document.documentElement.style.overflow = "visible";
                  onTransition = false;
              }
          };
          entryContent.addEventListener("transitionend", onOpacityEnd);
      });
  });
};

// Event Listeners
const items = [].slice.call(document.getElementsByClassName("item"));
items.forEach(function(item, i) {
  item.addEventListener("click", function(e) {
      if (onTransition) return;
      onTransition = true;
      state.transitionElementIndex = i;
      // For testing purposes im using toggle. Remove Lat();
      document.documentElement.style.overflow = "hidden";
      initBlog();
      item.classList.add("active");
      views.list.classList.add("hide");
      const onOpacityEnd = function(e) {
          if (e.target == this && e.propertyName === "opacity") {
              // Remove on listen = no problems later
              views.list.removeEventListener("transitionend", onOpacityEnd);
              item.classList.remove("active");
              views.list.style.display = "none";
              // Now our  list-view is out. And blog is already in position. START THE MADNESS

              animateBlog();
          }
      };
      views.list.addEventListener("transitionend", onOpacityEnd);
  });
});

const blogBack = document.getElementById("blog-back");
blogBack.addEventListener("click", () => {
  if (onTransition) return;
  onTransition = true;
  document.documentElement.style.overflow = "hidden";
  // Overflow is hidden but scroll mantains for some reason
  // ??? should investigate
  // Move scroll back to top
  document.documentElement.scrollTop = 0;
  views.blog.classList.add("hide");
  // Display list before hand(because if done at the same time of removing the class,
  // wont play)
  views.list.style.display = "";

  // list view is on top of blog. So, whithout position absolute. It will push it down.
  // Kinda hacky because of the fact that i always have both views on dom
  views.list.style.position = "absolute";
  const onOpacityEnd = function(e) {
      if (e.target == this && e.propertyName === "opacity") {
          // Remove on listen = no problems later
          views.blog.removeEventListener("transitionend", onOpacityEnd);
          // Let the element go to the top again
          views.list.style.position = "";

          // Let the elemets show, and let the user scroll
          translateOnScroll();
          views.list.classList.remove("hide");
          document.documentElement.style.overflow = "visible";
          onTransition = false;
      }
  };
  views.blog.addEventListener("transitionend", onOpacityEnd);
});

// eEvent lsiteners
window.addEventListener("scroll", function(e) {
  translateOnScroll();
});

// On start of page
const init = () => {
  // Initiate innerImage translate Effect in case page is already scrolled
  translateOnScroll();

  // Initiate panels depending on Index
  const panels = [].slice.call(document.getElementsByClassName("panel"));
  panels.forEach(function(p, i) {
      // Calculate Real Index
      // Normal index is first left and then right
      const lastLeftIndex = Math.floor(panels.length / 2);
      const realIndex =
          (i >= lastLeftIndex ? 1 + 2 * (i - lastLeftIndex) : 2 + 2 * i) - 1;
      // Third of transition duration
      p.style.transitionDelay = `${0.375 * realIndex + 0.25}s`;
      p.style.transform = "scaleX(0)";
  });
};

init();

// Debug

const debugList = {
  button: document.getElementById("debug-list"),
  display: document.getElementById("debug-list-display")
};
debugList.button.addEventListener("click", function(e) {
  e.preventDefault();
  if (views.list.classList.contains("hide")) {
      debugList.display.classList.add("active");
      debugList.display.innerHTML = "ON";
      views.list.classList.remove("hide");
  } else {
      debugList.display.classList.remove("active");
      debugList.display.innerHTML = "OFF";
      views.list.classList.add("hide");
  }
});