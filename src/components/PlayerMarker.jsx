import { memo } from 'react'

const PlayerMarker = memo(() => {
  return (
    <div className="player-marker">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M16 4C12 4 10 8 10 12C10 16 12 20 16 22C20 20 22 16 22 12C22 8 20 4 16 4Z"
          fill="#C5A55A"
          opacity="0.8"
        />
        <circle cx="16" cy="11" r="3" fill="#C5A55A" opacity="0.9" />
        <path
          d="M10 18C8 20 6 24 6 28H26C26 24 24 20 22 18"
          fill="#C5A55A"
          opacity="0.7"
        />
      </svg>
      <div className="player-glow" />
    </div>
  )
})

PlayerMarker.displayName = 'PlayerMarker'

export default PlayerMarker
