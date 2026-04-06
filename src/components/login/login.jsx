import { useState } from 'react';
import './login.css'
import { toast } from 'react-toastify';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { auth, db, FIREBASE_COLLECTIONS, FIREBASE_FIELDS } from '../../lib/firbase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import ThemeToggle from '../themeToggle/themeToggle';

const Login = () => {
    const [avtar, setAvtar] = useState({ file: null, url: "" })
    const [loading, setLoading] = useState(false)
    const [isSignupView, setIsSignupView] = useState(false)

    const handleAvtar = e => {
        setAvtar({
            file: e.target.files[0],
            url: URL.createObjectURL(e.target.files[0])
        })
    }

    const handleLogin = async (e) => {
        if (auth.currentUser?.uid) {
            toast.info('User already logged in');
            return;
        }

        setLoading(true);
        e.preventDefault()
    
        const formData = new FormData(e.target)
        const { email, password } = Object.fromEntries(formData);
        try {
            const cred = await signInWithEmailAndPassword(auth, email, password)

            const uid = cred.user?.uid
            if (uid) {
                const userRef = doc(db, FIREBASE_COLLECTIONS.USERS, uid)
                const snap = await getDoc(userRef)
                if (!snap.exists()) {
                    await setDoc(userRef, {
                        [FIREBASE_FIELDS.USERNAME]: email.split('@')[0],
                        [FIREBASE_FIELDS.BIO]: '',
                        [FIREBASE_FIELDS.EMAIL]: email,
                        [FIREBASE_FIELDS.AVATAR]: '',
                        [FIREBASE_FIELDS.UID]: uid,
                        [FIREBASE_FIELDS.BLOCKED]: [],
                    })
                    await setDoc(doc(db, FIREBASE_COLLECTIONS.USER_CHATS, uid), { [FIREBASE_FIELDS.CHATS]: [] })
                }
            }
            toast.success('Login successful!')
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
        finally {
            setLoading(false)
        }
    }
    const handleRegister = async (e) => {
        setLoading(true)
        e.preventDefault()
        const formData = new FormData(e.target)
        const { email, password } = Object.fromEntries(formData);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            await setDoc(doc(db, FIREBASE_COLLECTIONS.USERS, userCredential.user.uid), {
                [FIREBASE_FIELDS.USERNAME]: '',
                [FIREBASE_FIELDS.BIO]: '',
                [FIREBASE_FIELDS.EMAIL]: email,
                [FIREBASE_FIELDS.AVATAR]: avtar.url || '',
                [FIREBASE_FIELDS.UID]: userCredential.user.uid,
                [FIREBASE_FIELDS.BLOCKED]: [],
            });
            await setDoc(doc(db, FIREBASE_COLLECTIONS.USER_CHATS, userCredential.user.uid), {
                [FIREBASE_FIELDS.CHATS]: [],
            });



            toast.success('Account created successfully!')
            setIsSignupView(false)
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        } finally {
            setLoading(false)
        }

    }
    return (
        <div className="login">
            {!isSignupView ? (
                <div className='item auth-card'>
                    <div className='auth-top'>
                        <ThemeToggle className='themeToggleLogin' />
                    </div>
                    <h2>Welcome Back</h2>
                    <form onSubmit={handleLogin}>
                        <input type="email" placeholder='Email' name='email' required />
                        <input type="password" placeholder='Password' name='password' required />
                        <button disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
                    </form>
                    <p className='switch-auth'>
                        Don&apos;t have an account?{" "}
                        <button type='button' className='link-button' onClick={() => setIsSignupView(true)}>
                            Sign up
                        </button>
                    </p>
                </div>
            ) : (
                <div className="item auth-card">
                    <div className='auth-top'>
                        <ThemeToggle className='themeToggleLogin' />
                    </div>
                    <h2>Create an account</h2>
                    <form onSubmit={handleRegister}>
                        <label htmlFor="file"> <img src={avtar.url || "./avtar.png"} alt="" />
                            Upload an image</label>
                        <input type="file" id="file" style={{ display: 'none' }} onChange={handleAvtar} />
                        <input type="email" placeholder='Email' name='email' required />
                        <input type="password" placeholder='Password' name='password' required />
                        <button disabled={loading}>{loading ? 'Creating account...' : 'Sign up'}</button>
                    </form>
                    <p className='switch-auth'>
                        Already have an account?{" "}
                        <button type='button' className='link-button' onClick={() => setIsSignupView(false)}>
                            Login
                        </button>
                    </p>
                </div>
            )}
        </div>
    )
}
export default Login;