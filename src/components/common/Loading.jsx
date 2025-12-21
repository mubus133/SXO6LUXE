import React from 'react'
import './Loading.css'

const Loading = ({ fullScreen = false, text = 'Loading...' }) => {
  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        <div className="loading-content">
          <div className="spinner"></div>
          <p className="loading-text">{text}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="loading-inline">
      <div className="spinner"></div>
      <span className="ms-2">{text}</span>
    </div>
  )
}

export default Loading