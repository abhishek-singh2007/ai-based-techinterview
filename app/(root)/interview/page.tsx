"use client";

import { useState } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    ArrowRight,
    BrainCircuit,
    CheckCircle2,
    Clock3,
    Sparkles,
    Target,
    Wand2,
} from "lucide-react";

import {
    Form,
    FormControl,
    FormField as RHFFormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import FormField from "@/components/FormField";

const generationSchema = z.object({
    role: z.string().min(2, "Role must be at least 2 characters"),
    type: z.enum(["behavioral", "technical", "mixed"], {
        errorMap: () => ({ message: "Select a valid interview type" }),
    }),
    level: z.enum(["entry level", "mid level", "senior level"], {
        errorMap: () => ({ message: "Select a valid experience level" }),
    }),
    techstack: z.string().min(2, "Tech stack required"),
    amount: z.coerce
        .number()
        .int()
        .min(1, "At least 1 question")
        .max(20, "Max 20 questions"),
});

type GenerationFormType = z.infer<typeof generationSchema>;

const interviewTypeOptions = [
    { label: "Behavioral", value: "behavioral" },
    { label: "Technical", value: "technical" },
    { label: "Mixed", value: "mixed" },
];

const experienceLevelOptions = [
    { label: "Entry Level", value: "entry level" },
    { label: "Mid Level", value: "mid level" },
    { label: "Senior Level", value: "senior level" },
];

const highlights = [
    {
        icon: BrainCircuit,
        title: "AI-generated questions",
        description: "Questions are tailored to your role, stack, and interview style.",
    },
    {
        icon: Target,
        title: "Focused practice",
        description: "Pick the experience level and number of questions you want to drill.",
    },
    {
        icon: Clock3,
        title: "Fast setup",
        description: "Generate the session in a few seconds and jump straight into practice.",
    },
];

const SelectFormField = ({
    control,
    name,
    label,
    options,
}: {
    control: Control<GenerationFormType>;
    name: "type" | "level";
    label: string;
    options: Array<{ label: string; value: string }>;
}) => {
    return (
        <RHFFormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                                {options.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
};

const Page = () => {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<GenerationFormType>({
        resolver: zodResolver(generationSchema),
        defaultValues: {
            role: "",
            type: "mixed",
            level: "mid level",
            techstack: "",
            amount: 5,
        },
    });

    const onSubmit = async (data: GenerationFormType) => {
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/vapi/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                const errorMsg =
                    result.error || "Failed to generate interview. Please try again.";
                toast.error(errorMsg);
                return;
            }

            if (result.success && result.interviewId) {
                toast.success(result.message || "Interview generated successfully!");
                router.push(`/interview/${result.interviewId}`);
            } else {
                toast.error("Interview creation failed. Please try again.");
            }
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Network error. Please check your connection.";
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute left-[-10%] top-[-8%] size-72 rounded-full bg-primary-200/15 blur-3xl" />
                <div className="absolute right-[-5%] top-[18%] size-80 rounded-full bg-success-100/10 blur-3xl" />
                <div className="absolute bottom-[-10%] left-[35%] size-96 rounded-full bg-light-400/10 blur-3xl" />
            </div>

            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
                <section className="flex flex-col gap-6 pt-2 lg:pt-8">
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm text-light-100 shadow-sm backdrop-blur">
                        <Sparkles className="size-4 text-primary-200" />
                        Start a new interview
                    </div>

                    <div className="max-w-2xl space-y-4">
                        <h2 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
                            Build a focused mock interview in a few inputs.
                        </h2>
                        <p className="max-w-xl text-lg text-light-100">
                            Choose the role, stack, and difficulty. PrepWise will generate a
                            clean interview session that matches the rest of the app&apos;s dark
                            shadcn-inspired style.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        {highlights.map((item) => {
                            const Icon = item.icon;

                            return (
                                <Card key={item.title} className="border-border/60 bg-card/80 backdrop-blur">
                                    <CardContent className="flex h-full flex-col gap-3 p-5">
                                        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary-200/15 text-primary-100">
                                            <Icon className="size-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-semibold">{item.title}</h3>
                                            <p className="text-sm text-light-100">{item.description}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    <Card className="border-border/60 bg-card/80 backdrop-blur">
                        <CardHeader>
                            <CardTitle>What happens next</CardTitle>
                            <CardDescription>
                                After you submit, we generate the interview and move you into the
                                live practice flow.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 pb-6">
                            {[
                                "We shape the question set around your role and stack.",
                                "You get a short session with the number of questions you picked.",
                                "You continue into the interview room for voice-led practice.",
                            ].map((step, index) => (
                                <div
                                    key={step}
                                    className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/40 p-4"
                                >
                                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-200 text-dark-100 text-sm font-semibold">
                                        {index + 1}
                                    </div>
                                    <p className="text-sm text-light-100">{step}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </section>

                <Card className="border-border/60 bg-card/90 shadow-2xl shadow-black/20 backdrop-blur">
                    <CardHeader className="space-y-3 pb-0">
                        <div className="flex items-center gap-2 text-sm text-primary-100">
                            <Wand2 className="size-4" />
                            Interview builder
                        </div>
                        <CardTitle className="text-2xl">Generate your session</CardTitle>
                        <CardDescription>
                            Fill in the core details and let PrepWise prepare the questions.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pb-6 pt-6">
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="flex flex-col gap-5"
                            >
                                <FormField
                                    control={form.control}
                                    name="role"
                                    label="Job Role"
                                    placeholder="e.g., Frontend Developer"
                                />

                                <div className="grid gap-5 md:grid-cols-2">
                                    <SelectFormField
                                        control={form.control}
                                        name="type"
                                        label="Interview Type"
                                        options={interviewTypeOptions}
                                    />

                                    <SelectFormField
                                        control={form.control}
                                        name="level"
                                        label="Experience Level"
                                        options={experienceLevelOptions}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="techstack"
                                    label="Tech Stack"
                                    placeholder="e.g., React, Next.js, TypeScript"
                                />

                                <FormField
                                    control={form.control}
                                    name="amount"
                                    label="Number of Questions"
                                    placeholder="5"
                                    type="number"
                                />

                                <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-sm text-light-100">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="size-4 text-success-100" />
                                        Ready in seconds
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ArrowRight className="size-4" />
                                        Voice interview next
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="h-12 w-full rounded-full bg-primary-200 px-6 font-semibold text-dark-100 hover:bg-primary-200/90"
                                >
                                    {isSubmitting ? "Generating..." : "Generate Interview"}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Page;