import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="font-bold text-lg">
              Kodemy
            </Link>
            <p className="text-sm text-muted-foreground mt-2">
              Learn anything, on your schedule. Quality courses from expert instructors.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Explore</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/browse" className="hover:text-foreground">
                  Browse Courses
                </Link>
              </li>
              <li>
                <Link href="/browse?category=Web Development" className="hover:text-foreground">
                  Web Development
                </Link>
              </li>
              <li>
                <Link href="/browse?category=Data Science" className="hover:text-foreground">
                  Data Science
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-foreground">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/terms" className="hover:text-foreground">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Kodemy. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
