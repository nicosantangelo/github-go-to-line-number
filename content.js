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
      return number
        ? document.querySelectorAll("[data-line-number='" + number + "']")
        : []
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

                modal.result.innerHTML = (lastIndex + 1) + "/" + lineNumbers.length

                var number = lineNumbers[lastIndex] // yeah I know I know, hoisting
                scrollIntoView(number)
              }
              return
            }

            lineNumbers = gutter.find(this.value)
            lastIndex = 0

            if (lineNumbers.length === 0) {
              modal.result.innerHTML = ''
              return
            }

            // Search result
            // Count only one per <tr>
            modal.result.innerHTML = "1" + "/" + lineNumbers.length

            var number = lineNumbers[lastIndex]
            scrollIntoView(number)

            debounce(function () {
              // Fetch the sibling with .blob-code
              var sibling = number.nextElementSibling

              // Don't hightlight if it didn't change
              sibling.style.backgroundColor = "#F8EEC7"

              setTimeout(function () {
                sibling.style.backgroundColor = "#FFF"
              }, 450)
            })

            // enter on modal input (cycle if > 1)
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

  var debounce = (function debounce() {
    var timerId
    return function (fn, time) {
      clearTimeout(timerId)
      timerId = setTimeout(function() {
        fn()
      }, time || 180)
    }
  })()

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
})()

// Inline html ?
// Use github styles ?