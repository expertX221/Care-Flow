import './globals.css';
export const metadata={title:'CareFlow — Less waiting. More peace of mind.',description:'A multilingual hospital queue and accessible navigation demonstration.',manifest:'/manifest.webmanifest'};
export default function Layout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}
