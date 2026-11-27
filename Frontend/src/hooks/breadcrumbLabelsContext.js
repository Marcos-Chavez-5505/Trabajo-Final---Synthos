import { createContext } from 'react'

/**
 * Labels dinámicos de los breadcrumbs. El `createContext` vive aparte del
 * provider para no romper el fast refresh (mismo patrón que `authContext.js`).
 */
export const BreadcrumbLabelsContext = createContext(null)
