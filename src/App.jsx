import { useImperativeHandle, useLayoutEffect, useRef } from 'react'
import TopMenu from './components/top-menu/TopMenu.jsx'
import menu from './components/top-menu/menu.json'
import pagesConfig from './pages/pages.json'
import Page from './pages/Page.jsx'
import { themeOf } from './pages/pagesSchema.js'
import { applyTheme } from './pages/themes.js'
import { usePageTransitions } from './transitions/usePageTransitions.js'
import './pages/themes.css'

// Each top-navigation item opens a page (item.page) with a transition
// (item.transition), both set in menu.json. Each page has its own theme in
// pages.json. renderPage, pages, transitionOptions and controllerRef let
// Storybook preview them.
function App({
  items = menu.items,
  pages = pagesConfig,
  initialId,
  transitionOptions,
  syncHistory = true,
  renderPage = (pageId) => <Page id={pageId} />,
  controllerRef,
}) {
  const mainRef = useRef(null)
  const { activeId, navigate, announcement, mainProps } = usePageTransitions({
    items,
    initialId,
    options: transitionOptions,
    syncHistory,
    mainRef,
  })
  useImperativeHandle(controllerRef, () => ({ navigate, activeId }), [navigate, activeId])

  const pageId = items.find((item) => item.id === activeId)?.page
  // Layout effect, so the theme flips in the same commit as the page swap
  // (under the transition overlay).
  const theme = themeOf(pages, pageId)
  useLayoutEffect(() => applyTheme(theme), [theme])
  useLayoutEffect(() => () => applyTheme(null), [])

  return (
    <div className="main-container">
      <TopMenu items={items} active={activeId} onChange={(id) => navigate(id)} />
      <main ref={mainRef} id="main-content" {...mainProps}>
        {renderPage(pageId)}
      </main>
      <p className="visually-hidden" role="status">
        {announcement}
      </p>
    </div>
  )
}

export default App
