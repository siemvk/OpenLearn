import { Button } from "../button/button";
import { useNavigate } from "react-router";

export const Navbar = () => {
    const navigate = useNavigate()
    return <nav>
        <div className="flex flex-row justify-evenly items-center pt-5">

            <Button variant='secondary' onClick={() => { navigate('/app') }}>Home</Button>
            <Button variant='secondary' onClick={() => { navigate('/app/forum') }}>Forum</Button>
        </div>
    </nav>;
}