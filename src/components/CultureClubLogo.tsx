import logo from '../assets/cultureclub-logo.png'
import './CultureClubLogo.css'

type CultureClubLogoProps = {
  size?: 'large' | 'small'
  caption?: string
}

export function CultureClubLogo({
  size = 'large',
  caption,
}: CultureClubLogoProps) {
  return (
    <div className={`cc-logo cc-logo-${size}`}>
      <img src={logo} alt="SMT Culture Club — Food, Fun, Service" />
      {caption ? <span className="cc-logo-caption">{caption}</span> : null}
    </div>
  )
}
