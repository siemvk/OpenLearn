import { Form, useNavigate } from "react-router";
import { Button } from "~/components/button/button";

export default function Component() {
    const redirector = useNavigate();
    return (
        <div>
            <h1>Temp UI</h1>
            <Button onClick={() => { redirector("/app/list/new/new") }}>New post</Button>
        </div>
    );
}