import React from "react";
import { Input } from "@/components/ui/input";
import { Controller, FieldValues, Path, Control } from "react-hook-form";
import {
    FormControl,
    FormDescription,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

interface FormFieldProps<T extends FieldValues> {
    control: Control<T>;
    label: string;
    name: Path<T>;
    placeholder?: string;
    type?: "text" | "email" | "password" | "file";
}

function FormField<T extends FieldValues>({control, name, label, placeholder, type = "text",}: FormFieldProps<T>) {
    return (
        <Controller
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="label">{label}</FormLabel>
                    <FormControl>
                        <Input
                            className="input"
                            placeholder={placeholder}
                            type={type} {...field} />
                    </FormControl>

                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

export { FormField };
