;(function () {
  'use strict'

  var MODAL_URL = chrome.extension.getURL('modal.html')

  var urlObserver = new window.MutationObserver(function (mutations, observer) {
    // Careful! this will get fired twice without the disconnect method
    modal.close()
    urlObserver.disconnect()
  })

  var modal = {
    el: document.createElement('div'),
    input: null,
    load: function (callback) {
      var xmlhttp = new XMLHttpRequest()

      xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
          modal.el.innerHTML = xmlhttp.responseText
          modal.input = modal.el.getElementsByTagName('input')[0]
          modal.close()
          document.body.appendChild(modal.el)

          // Text input
          var lineNumbers = []
          modal.addEventListener('input', 'keyup', function (event) {
            if (!isNumber(this.value)) {
              return
            }

            if (event.key === 'Enter' && lineNumbers.length === 1) {
              modal.close()
              lineNumbers = []
              return
            }

            lineNumbers = findLineNumbers(this.value)

            if (lineNumbers.length === 0) {
              return
            }

            // search result
            var number  = lineNumbers[0]
            var sibling = number.nextElementSibling
            scrollTo(0, number.offsetTop)

            debounce(function () {
              // Don't hightlight if it didn't change
              sibling.style.backgroundColor = "#F8EEC7"

              setTimeout(function () {
                sibling.style.backgroundColor = "#FFF"
              }, 450)
            })

            // enter on modal input (cycle if > 1)
            // enter on modal input (cycle goto if == 1)
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

      if (event.ctrlKey && event.key === 'g' && hasLineNumbers()) {
        modal.toggle()
      }
    }, false)
  })

  function hasLineNumbers() {
    return document.querySelectorAll("[data-line-number]").length
  }

  function findLineNumbers(number) {
    return number
      ? document.querySelectorAll("[data-line-number='" + number + "']")
      : []
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

  function isNumber(value) {
    return !isNaN(+value)
  }
})()

// Inline html ?
// Use github styles ?