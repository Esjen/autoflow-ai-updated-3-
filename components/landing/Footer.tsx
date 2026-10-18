import Container from "@/components/shared/Container";

export default function Footer() {
  return (
    <footer id="contact" className="border-t">
      <Container>
        <div className="grid gap-12 py-16 md:grid-cols-4">

          <div>
            <h3 className="text-xl font-bold">
              AutoFlow AI
            </h3>

            <p className="mt-4 text-sm text-muted-foreground">
              AI-powered workflow automation built to help businesses
              capture, qualify and convert more leads.
            </p>
          </div>

          <div>
            <h4 className="font-semibold">
              Product
            </h4>

            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>Features</li>
              <li>Pricing</li>
              <li>Documentation</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold">
              Company
            </h4>

            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>About</li>
              <li>Contact</li>
              <li>Careers</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold">
              Resources
            </h4>

            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>Blog</li>
              <li>Support</li>
              <li>Privacy Policy</li>
            </ul>
          </div>

        </div>

        <div className="border-t py-6 text-center text-sm text-muted-foreground">
          © 2026 AutoFlow AI. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}