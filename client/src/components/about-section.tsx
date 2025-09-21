import { Card, CardContent } from "@/components/ui/card";
import { FileText, Bot, Download } from "lucide-react";

export default function AboutSection() {
  return (
    <section className="p-6">
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-2xl font-semibold">Welcome to StudyApp</h2>
            <p className="mb-4 text-muted-foreground">
              StudyApp is an AI-powered study platform that helps you create, organize, and enhance your learning experience. 
              Upload PDFs, take notes, and get instant AI explanations to accelerate your understanding.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-secondary p-4">
                <FileText className="mb-2 h-8 w-8 text-primary" />
                <h3 className="mb-2 font-medium">PDF Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Upload and highlight PDFs for instant AI explanations
                </p>
              </div>
              <div className="rounded-lg bg-secondary p-4">
                <Bot className="mb-2 h-8 w-8 text-primary" />
                <h3 className="mb-2 font-medium">Multi-AI Support</h3>
                <p className="text-sm text-muted-foreground">
                  Query multiple AI models simultaneously for diverse perspectives
                </p>
              </div>
              <div className="rounded-lg bg-secondary p-4">
                <Download className="mb-2 h-8 w-8 text-primary" />
                <h3 className="mb-2 font-medium">Export Notes</h3>
                <p className="text-sm text-muted-foreground">
                  Download your notes as beautifully formatted PDFs
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
