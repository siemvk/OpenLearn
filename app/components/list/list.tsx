import { useNavigate } from "react-router"
export const ListContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="flex flex-col items-center justify-center min-w-screen bg-openlearn-800 rounded-max">
            {children}
        </div>
    )
}

export const ListItem: React.FC<{
    children?: React.ReactNode,
    linkTo: string,
    title: string,
    subtitle?: string

}> = ({ children, linkTo, title, subtitle }) => {
    const navigate = useNavigate()
    return (
        <div className="border p-4 m-2 w-96 " onClick={() => navigate(linkTo)}>
            <h1>{title}</h1>
            <p>{subtitle}</p>
            {/* aan de linkerkant de rest van de dingen laten zien (voor knoppen enzo) */}
            {children}
        </div>
    )
}