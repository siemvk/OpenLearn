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
    linkTo?: string,
    title: string,
    subtitle?: string,
    image?: string,
    swapSubtitleAndTitle?: boolean,
    className?: string
}> = ({ children, linkTo, title, subtitle, image, swapSubtitleAndTitle, className: cName }) => {
    const navigate = useNavigate()
    return (
        <div className={"bg-openlearn-800 rounded-xl p-4 cursor-pointer " + cName} onClick={() => navigate(linkTo || '#')}>
            <div className="flex flex-row gap-4">
                {image && <img src={image} alt="Image" className="w-12 h-12 rounded-full" />}
                <div className="flex flex-row w-full">
                    <div className="flex flex-col flex-1">
                        {swapSubtitleAndTitle && <p className="text-gray-200 text-sm">{subtitle}</p>}
                        <h1 className="font-semibold text-lg text-gray-100">{title}</h1>
                        {!swapSubtitleAndTitle && <p className="text-gray-200 text-sm">{subtitle}</p>}
                    </div>

                    <div onClick={(event) => event.stopPropagation()} className="flex flex-row ml-auto shrink-0">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}