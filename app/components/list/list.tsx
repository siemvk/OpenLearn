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
    subtitle?: string,
    image?: string
}> = ({ children, linkTo, title, subtitle, image }) => {
    const navigate = useNavigate()
    return (
        <div className="bg-openlearn-800 rounded-xl p-4 cursor-pointer mx-10" onClick={() => navigate(linkTo)}>
            <div className="flex flex-row gap-4">
                {image && <img src={image} alt="Image" className="w-12 h-12 rounded-full" />}
                <div>
                    <h1 className="font-semibold text-lg text-gray-100">{title}</h1>
                    <p className="text-gray-200 text-sm">{subtitle}</p>
                    <div onClick={(event) => event.stopPropagation()}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}