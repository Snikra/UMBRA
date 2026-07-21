import { memo } from 'react'

const CompassRose = memo(({ heading }) => {
  return (
    <div className="compass-rose" style={{ transform: `rotate(${heading || 0}deg)` }}>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" stroke="#C5A55A" strokeWidth="1" opacity="0.4" />
        <circle cx="24" cy="24" r="2" fill="#C5A55A" />
        <polygon points="24,2 27,22 24,24 21,22" fill="#8B0000" />
        <polygon points="24,46 21,26 24,24 27,26" fill="#C5A55A" opacity="0.5" />
        <polygon points="2,24 22,21 24,24 22,27" fill="#C5A55A" opacity="0.5" />
        <polygon points="46,24 26,27 24,24 26,21" fill="#C5A55A" opacity="0.5" />
      </svg>
      <span className="cardinal n">N</span>
      <span className="cardinal s">S</span>
      <span className="cardinal e">E</span>
      <span className="cardinal w">W</span>
    </div>
  )
})

CompassRose.displayName = 'CompassRose'

export default CompassRose
