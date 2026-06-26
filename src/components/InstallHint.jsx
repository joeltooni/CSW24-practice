import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Share, SquarePlus, X } from 'lucide-react'

const DISMISS_KEY = 'installHintDismissed'

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true

const isIOS = () =>
  /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
  // iPadOS 13+ reports as Mac; detect touch to disambiguate.
  (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)

// Shows a real "Install" button where the browser supports it (Android/desktop
// Chrome), and step-by-step Share → Add to Home Screen instructions on iOS,
// which never fires an automatic install prompt.
export default function InstallHint() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isStandalone() || sessionStorage.getItem(DISMISS_KEY)) return

    const onBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    // iOS has no beforeinstallprompt — show manual instructions instead.
    if (isIOS()) setShow(true)

    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  const dismiss = () => {
    setShow(false)
    sessionStorage.setItem(DISMISS_KEY, '1')
  }

  const install = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    dismiss()
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="install-hint"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
        >
          <span className="install-icon">
            <Download size={18} />
          </span>

          {deferredPrompt ? (
            <div className="install-body">
              <strong>Install this app</strong>
              <span>Add it to your home screen for fullscreen, offline play.</span>
              <button className="primary install-btn" onClick={install}>
                <Download size={16} /> Install
              </button>
            </div>
          ) : (
            <div className="install-body">
              <strong>Add to Home Screen</strong>
              <span className="install-steps">
                Tap <Share size={14} /> Share, then{' '}
                <SquarePlus size={14} /> "Add to Home Screen".
              </span>
            </div>
          )}

          <button className="install-close" onClick={dismiss} aria-label="Dismiss">
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
