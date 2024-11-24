import CreateGroup from "~/pages/chat/CreateGroupLayout" 
import Login from "~/pages/login/Login"
import LoginComponent from "~/pages/login/login.component"

export default function App() {
   LoginComponent('user1', 'User@123')
   return <Login />
}  