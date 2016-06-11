(function (d, w){
  // LESS TYPING

  var $ = d.querySelector.bind(d);
  var $$ = d.querySelectorAll.bind(d);

  // TICKING SYSTEM - window scroll throttle

  var ticking = false;
  var updateChain = [];

  function requestTick() {
    if(!ticking) {
      requestAnimationFrame(update);
    }
    ticking = true;
  }

  w.addEventListener('scroll', function (e) {
    requestTick();
  });

  function update() {
    // call functions in the chain one by one
    for (var i = 0; i < updateChain.length; i ++) {
      updateChain[i]();
    }
    ticking = false;
  }


  // <header> nav -> responsive

  var burger = $('.hamburger');
  var headerNav = $('.nav');
  burger.addEventListener('click', function (ev) {
    burger.classList.toggle('toggle');
    headerNav.classList.toggle('toggle');
  });

  // STICK TOC

  var toc = $('.toc');
  var tocAnchor = $('.post-content');
  if (toc && toc.clientHeight < window.innerHeight) {
    stickToc();
    updateChain.push(stickToc);
  }

  function stickToc() {
    var tocTop = tocAnchor.getBoundingClientRect().top;
    if (tocTop <= 0) {
      toc.classList.add('fixed');
    } else {
      toc.classList.remove('fixed');
    }
  }

  // POSTS NAV POSITION

  var nav = $('.post-nav');
  if (nav) {
    updateNav();
    updateChain.push(updateNav);
  }

  function updateNav() {
    var navTop = nav.getBoundingClientRect().top;

    var prev = $('.post-nav .prev');
    var next = $('.post-nav .next');
    if (navTop < w.innerHeight) {
      prev && !prev.classList.contains('stop') && prev.classList.add('stop');
      next && !next.classList.contains('stop') && next.classList.add('stop');
    } else {
      prev && prev.classList.contains('stop') && prev.classList.remove('stop');
      next && next.classList.contains('stop') && next.classList.remove('stop');
    }
  }

  // .post-footer comments button
  var disqus = $('#disqus_thread');
  var commentsTrigger = $('#comments-trigger');
  var disqus_loaded = false;
  if (commentsTrigger) {
    commentsTrigger.addEventListener('click', function (ev) {
      ev.preventDefault();
      if (! disqus_loaded) {
        load_disqus(); // from _partial/disqus.ejs
        disqus_loaded = true;
      } else {
        disqus.classList.toggle('hide');
      }
    });
  }

  //debugger;
}(document, window))