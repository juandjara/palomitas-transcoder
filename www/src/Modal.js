import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'

const ModalStyles = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0, 0.25);
  z-index: 1;

  .modal-inner {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #333;
    background-color: white;
    width: 100%;
    max-width: 760px;
    border-radius: 8px;
  }
`
function noop () {}

function Modal ({ children, onClose = noop }) {
  const modalRef = useRef(null)

  function onModalClick (ev) {
    const el = modalRef.current
    const contains = el && el.contains(ev.target)
    if (!contains) {
      onClose()
    }
  }

  useEffect(() => {
    window.addEventListener('click', onModalClick)
    return () => {
      window.removeEventListener('click', onModalClick)
    }
  }, [])

  return (
    <ModalStyles>
      <div ref={modalRef} className="modal-inner">
        {children}
      </div>
    </ModalStyles>
  )
}

export default Modal
