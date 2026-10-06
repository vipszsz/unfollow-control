import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Icon, type IconName } from './Icon'

type Variant = 'primary' | 'ghost' | 'plain' | 'icon' | 'danger'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  icon?: IconName
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'plain', icon, className = '', children, type = 'button', ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={`btn btn-${variant} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={variant === 'icon' ? 16 : 14} />}
      {children}
    </button>
  )
})
