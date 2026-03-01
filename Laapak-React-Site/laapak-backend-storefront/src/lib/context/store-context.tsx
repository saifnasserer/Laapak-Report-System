"use client"

import React, { createContext, useContext, useState } from "react"

interface StoreContextType {
    isSidebarOpen: boolean
    setIsSidebarOpen: (isOpen: boolean) => void
}

const StoreContext = createContext<StoreContextType>({
    isSidebarOpen: false,
    setIsSidebarOpen: () => { },
})

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    return (
        <StoreContext.Provider value={{ isSidebarOpen, setIsSidebarOpen }}>
            {children}
        </StoreContext.Provider>
    )
}

export const useStoreContext = () => useContext(StoreContext)
