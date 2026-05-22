import type { User } from "../../types"

interface NavbarProps {
  user: User | null
}

const Navbar = ({ user }: NavbarProps) => {
  return (
    <div className="flex justify-between items-center p-4 bg-white">
      <h1 className="text-2xl font-bold">Important!</h1>
      {user && (
        <div className="flex gap-x-4">
          <button className="bg-blue-500 text-white p-2 px-4 rounded-md">
          {/* TODO: Actually logout */}
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

export default Navbar
