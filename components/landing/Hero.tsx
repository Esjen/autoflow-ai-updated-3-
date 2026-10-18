import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center px-6">
      <div className="grid w-full gap-16 lg:grid-cols-2">
        {/* Left Side */}
        <div className="flex flex-col justify-center">
          <span className="mb-4 w-fit rounded-full border px-4 py-1 text-sm font-medium text-muted-foreground">
            AI Sales Automation
          </span>

          <h1 className="text-5xl font-bold tracking-tight lg:text-6xl">
            Turn Every Customer Enquiry Into a Sale
          </h1>

          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            AutoFlow AI captures leads, qualifies them with AI, automates
            follow-ups, and helps your business close more customers without
            increasing your workload.
          </p>

          <div className="mt-8 flex gap-4">
            <Button size="lg">
              Start Free
            </Button>

            <Button variant="outline" size="lg">
              Book Demo
            </Button>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-lg">
            <div className="mb-4 text-sm text-muted-foreground">
              Live Lead Preview
            </div>

            <h3 className="text-xl font-semibold">
              John Smith
            </h3>

            <p className="mt-2 text-muted-foreground">
              Website Design Enquiry
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex justify-between">
                <span>Lead Score</span>
                <span className="font-semibold text-green-600">
                  95 / 100
                </span>
              </div>

              <div className="flex justify-between">
                <span>Budget</span>
                <span>₦5,000,000</span>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <p className="font-medium">
                  AI Recommendation
                </p>

                <p className="mt-2 text-sm text-muted-foreground">
                  Call this customer within the next 10 minutes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}