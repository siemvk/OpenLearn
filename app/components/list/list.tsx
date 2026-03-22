import { useNavigate } from "react-router"
export const ListContainer: React.FC<{ children: React.ReactNode, className: string }> = ({ children, className }) => {
    return (
        <div className={"flex flex-col gap-2 w-full " + className} >
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
        <div className="bg-openlearn-800 rounded-xl p-4 cursor-pointer" onClick={() => navigate(linkTo)}>
            <h1 className="font-semibold text-lg text-gray-100">{title}</h1>
            <p className="text-gray-200 text-sm">{subtitle}</p>
            {/* aan de linkerkant de rest van de dingen laten zien (voor knoppen enzo) */}
            {children}
        </div>
    )
}