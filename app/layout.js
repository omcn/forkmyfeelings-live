


// import "./globals.css";
// import { Inter } from "next/font/google";

// const inter = Inter({ subsets: ["latin"] });

// export const metadata = {
//   title: "Fork My Feels",
//   description: "Feed your mood.",
// };

// export default function RootLayout({ children }) {
//   return (
//     <html lang="en">
//       <head>
//         {/* ✅ Add this line for your favicon */}
//         <link rel="icon" href="/rascal-fallback.png" type="image/png" />
//       </head>
//       <body className="font-sans bg-rose-50 text-gray-900">
//         {children}

//         {/* ✅ Footer inside body tag */}
//         <footer className="mt-16 text-sm text-gray-500 text-center pb-10">
//           <p>
//             © {new Date().getFullYear()} Fork My Feels •{" "}
//             <a href="/privacy-policy" className="underline hover:text-gray-700">
//               Privacy Policy
//             </a>
//           </p>
//         </footer>
//       </body>
//     </html>
//   );
// }

import "./globals.css";
import { Inter } from "next/font/google";
import SupabaseAuthWatcher from "../components/SupabaseAuthWatcher"; // ✅ Adjust path if needed

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Fork My Feels",
  description: "Feed your mood.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/rascal-fallback.png" type="image/png" />
      </head>
      <body className="font-sans bg-rose-50 text-gray-900">
        <SupabaseAuthWatcher /> {/* ✅ Ensures profile creation after auth */}
        {children}

        <footer className="mt-16 text-sm text-gray-500 text-center pb-10">
          <p>
            © {new Date().getFullYear()} Fork My Feels •{" "}
            <a href="/privacy-policy" className="underline hover:text-gray-700">
              Privacy Policy
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}







