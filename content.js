;(function () {
  'use strict'

  var MODAL_URL = chrome.extension.getURL('modal.html')

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
      // TODO
    },
    open: function () {
      modal.el.style.display = 'block'
      modal.input.focus()
    },
    close: function () {
      modal.el.style.display = 'none'
      modal.input.value = ''
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
        modal.open()
        observeURL()
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

  function observeURL() {
    var obs = new window.MutationObserver(function (mutations, observer) {
      // Careful! this will get fired twice without the disconnect method
      modal.close()
      obs.disconnect()
    })

    obs.observe(document.getElementById('js-pjax-loader-bar'), { attributes: true, attributeFilter: ['class'] })
    return obs
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