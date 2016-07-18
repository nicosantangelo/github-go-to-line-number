;(function () {
  'use strict'

  var gutter = {
    root: document.getElementById('js-repo-pjax-container'),
    exists() {
      return gutter.root.querySelectorAll('td[data-line-number]').length
    },
    find(number) {
      var lineNumbers = gutter.root.querySelectorAll('td[data-line-number="' + number + '"]')
      var parents = []
      
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
    load: function (html) {
      modal.el.innerHTML = html
      modal.input = modal.el.getElementsByTagName('input')[0]
      modal.result = modal.el.getElementsByTagName('small')[0]
      modal.close()
      document.body.appendChild(modal.el)

      modal.addEvents()
    },
    addEvents: function () {
      var lineNumbers = []
      var lastIndex = 0
      var showCurrentLineNumber = function () {
        if (lineNumbers.length > 1) {
          modal.result.innerHTML = (lastIndex + 1) + '/' + lineNumbers.length
        }

        var lineNumber = lineNumbers[lastIndex]
        var codeBlock  = lineNumber.parentElement.lastElementChild

        scrollIntoView(lineNumber)
        hightlight(codeBlock)
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
            if (event.shiftKey) {
              lastIndex -= 1

              if (lastIndex === -1) {
                lastIndex = lineNumbers.length - 1
              }
            } else {
              lastIndex += 1

              if (lastIndex === lineNumbers.length) {
                lastIndex = 0
              }
            }
            
            showCurrentLineNumber()
          }
          return
        }

        if (event.key !== 'Backspace' && event.key !== 'Delete' && !isNumber(event.key)) {
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

      modal.addEventListener('svg', 'click', modal.close)
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

  var urlObserver = new window.MutationObserver(function (mutations, observer) { modal.close() })

  // -----------------------------------------------------------------------------
  // Start
 
  var xmlhttp = new XMLHttpRequest()

  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
      modal.load(xmlhttp.responseText)

      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
          modal.close()
          return
        }

        if (event.ctrlKey && event.key === 'g' && gutter.exists()) {
          modal.toggle()
          event.preventDefault()
        }
      }, false)

      document.addEventListener('click', function (event) {
        // Shipit. Checks if the modal was clicked in a rather hackish way
        if (event.path.length < 2 || event.path[2].className.search('gotoline') === -1) {
          modal.close()
        }
      }, false)
    }
  }
  xmlhttp.open('GET', chrome.extension.getURL('modal.html'), true)
  xmlhttp.send()

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

  var hightlight = debounce(function (el) {
    var backgroundColor = el.style.backgroundColor

    el.style.backgroundColor = '#F8EEC7'

    setTimeout(function () {
      el.style.backgroundColor = backgroundColor
    }, 450)
  })

  function debounce(fn, time) {
    var timerId
    time = time || 200
    return function () {
      var args = arguments
      var self = this

      clearTimeout(timerId)
      timerId = setTimeout(function() { fn.apply(self, args) }, time)
    }
  }
})()
