'use client'
import "../sign-up/sign-up.css"
import Input from "@/components2/input.jsx"
import Button from "@/components2/button.jsx"
import Link from "next/link"
import {useState} from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter()
    const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  
  const handleLogin = async (e) =>{
    e.preventDefault()
    if(!email || !password){
        alert("your form is invalid")
        return     
    }
    
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
     email,
     password,
    });
    if(error){
      console.error(error)
      alert(`Couldn't log in: ${error.message}`)
      return
    }
      // Go back to the page that asked for sign-in (same-site paths only)
      const next = new URLSearchParams(window.location.search).get("next")
      router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : "/")
      router.refresh()
  }
  return (
    <div className="auth-page">
      <form onSubmit={handleLogin} className="auth-form">
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Log in to continue studying.</p>

        <Input must={true} pro="Email" id="email" type="email" logic={(e) => {setEmail(e.target.value)}} value="Enter your email" />
        <Input must={true} pro="Password" id="password"  logic={(e) => {setPassword(e.target.value)}}  type="password" value="Enter your password" />

        <Button info="Log in" type="submit" />

        <div className="login">
          <p>
            Don't have an account?{" "}
            <Link href={`/sign-up${typeof window !== "undefined" ? window.location.search : ""}`} className="login-link">Sign up</Link>
          </p>
        </div>
      </form>
    </div>
  )
}
