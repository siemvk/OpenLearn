import { Button } from "../button/button";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import logo from "~/../public/logo_outline.svg";
import "./navbar.css";

export const Navbar = () => {
    const navigate = useNavigate()
    return <nav>
        {/* oh ja ik vind animations leuk. */}
        <motion.div
            className="flex flex-row justify-left items-center gap-3 translate-x-6 translate-y-6"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
        >
            <img src={logo} alt="Logo" className="logo" onClick={() => navigate('/app')}/>
            <div className={'navbar'}>
                <Button variant='secondary' onClick={() => { navigate('/app') }}>Home</Button>
                <Button variant='secondary' onClick={() => { navigate('/app/forum') }}>Forum</Button>
            </div>
        </motion.div>
    </nav>;
}