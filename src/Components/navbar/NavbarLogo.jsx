import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";

export default function NavbarLogo() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <img
        src={logo}
        alt="Farm Fresh Dairy"
        className="w-12 h-12 rounded-full border-2 border-green-200"
      />

      <div>
        <h1 className="text-2xl font-black text-green-700">
          FarmFreshDairy
        </h1>

        <p className="text-sm text-gray-500">
          Pure Milk Delivered Daily
        </p>
      </div>
    </Link>
  );
}