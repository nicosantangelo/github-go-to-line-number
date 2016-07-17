;(function () {
  'use strict'

  var MODAL_URL = chrome.extension.getURL('modal.html')

  var urlObserver = new window.MutationObserver(function (mutations, observer) {
    // Careful! this will get fired twice without the disconnect method
    modal.close()
    urlObserver.disconnect()
  })

  var gutter = {
    exists() {
      return document.querySelectorAll("[data-line-number]").length
    },
    find(number) {
      var lineNumbers = document.querySelectorAll("[data-line-number='" + number + "']")
      var parents     = []
      
      if(lineNumbers.length === 0) {
        return []
      }

      return Array.prototype.filter.call(lineNumbers, function (number) {
        if (parents.indexOf(number.parentElement) === -1) {
          parents.push(number.parentElement)
          return true
        }
      })
    }
  }

  var modal = {
    el: document.createElement('div'),
    input: null,
    result: null,
    load: function (callback) {
      var xmlhttp = new XMLHttpRequest()

      xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
          modal.el.innerHTML = xmlhttp.responseText
          modal.input = modal.el.getElementsByTagName('input')[0]
          modal.result = modal.el.getElementsByTagName('small')[0]
          modal.close()
          document.body.appendChild(modal.el)

          // Text input
          var lineNumbers = []
          var lastIndex = 0
          var showCurrentLineNumber = function () {
            modal.result.innerHTML = (lastIndex + 1) + "/" + lineNumbers.length

            // Fetch the sibling with .blob-code
            // Don't hightlight if it didn't change
            var lineNumber = lineNumbers[lastIndex]
            scrollIntoView(lineNumber)
            hightlight(lineNumber.nextElementSibling)
          }

          modal.addEventListener('input', 'keyup', function (event) {
            if (!isNumber(this.value)) {
              modal.result.innerHTML = ''
              return
            }

            if (event.key === 'Enter') {
              if(lineNumbers.length <= 1) {
                modal.close()
                lineNumbers = []
              } else {
                lastIndex += 1
                if (lastIndex === lineNumbers.length) {
                  lastIndex = 0
                }
                showCurrentLineNumber()
              }
              return
            }

            lineNumbers = gutter.find(this.value)
            lastIndex = 0

            if (lineNumbers.length === 0) {
              modal.result.innerHTML = ''
              return
            }

            showCurrentLineNumber()
          })

          // Close button
          modal.addEventListener('svg', 'click', modal.close)

          callback()
        }
      }



      xmlhttp.open('GET', MODAL_URL, true)
      xmlhttp.send()
    },
    toggle: function () {
      if (modal.el.style.display === 'none') {
        modal.open()
      } else {
        modal.close()
      }
    },
    open: function () {
      modal.el.style.display = 'block'
      modal.input.focus()

      urlObserver.observe(document.getElementById('js-pjax-loader-bar'), {
        attributes: true,
        attributeFilter: ['class']
      })
    },
    close: function () {
      modal.el.style.display = 'none'
      modal.input.value = ''
      modal.result.innerHTML = ''

      urlObserver.disconnect()
    },
    addEventListener: function (selector, event, fn) {
      modal.el.querySelector(selector).addEventListener(event, fn, false)
    }
  }

  modal.load(function globalKeyboardShortcut() {
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        modal.close()
        return
      }

      if (event.ctrlKey && event.key === 'g' && gutter.exists()) {
        modal.toggle()
      }
    }, false)
  })

  // -----------------------------------------------------------------------------
  // Utils

  function isNumber(value) {
    return !isNaN(+value)
  }

  function scrollIntoView(el) {
    var top = documentOffsetTop(el) - ( window.innerHeight / 2 )
    window.scrollTo(0, top)
  }

  function documentOffsetTop(el) {
    return el.offsetTop + ( el.offsetParent ? documentOffsetTop(el.offsetParent) : 0 )
  }

  function hightlight(el) {
    debounce(function () {
      var backgroundColor = el.style.backgroundColor

      el.style.backgroundColor = "#F8EEC7"

      setTimeout(function () {
        el.style.backgroundColor = backgroundColor
      }, 450)
    })
  }

  var debounce = (function debounce() {
    var timerId
    return function (fn, time) {
      clearTimeout(timerId)
      timerId = setTimeout(function() {
        fn()
      }, time || 180)
    }
  })()
})()

// Inline html ?
// Use github styles ?