import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AccessDeniedProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function AccessDenied({ title, description, action }: AccessDeniedProps) {
  return (
    <Card className="w-full max-w-md border-destructive/30 shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {action ? <CardContent>{action}</CardContent> : null}
    </Card>
  );
}
