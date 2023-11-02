"use server";
import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";

// note: old version that don't have validate form
// const InvoiceSchema = z.object({
//     id: z.string(),
//     customerId: z.string(),
//     amount: z.coerce.number(),
//     status: z.enum(["pending", "paid"]),
//     date: z.string(),
// });

// note: version with validate form 
const InvoiceSchema = z.object({
  id: z.string(),
  customerId: z.string({
    // invalid_type_error: 'Please select a customer.',
    required_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    // invalid_type_error: 'Please select an invoice status.',
    required_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

const CreateInvoice = InvoiceSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export type TErrorState = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
    const rawFormData = Object.fromEntries(formData.entries());

    // note: old version without validate form in server action
    // const { customerId, amount, status } = CreateInvoice.parse(rawFormData);

    const validatedFields = CreateInvoice.safeParse(rawFormData);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing Fields. Failed to Create Invoice.",
        };
    }

    const {
        data: { amount, customerId, status },
    } = validatedFields;
    
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split("T")[0];
    try {
        await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `;
    } catch (err) {
        return {
            message: "Database Error: Failed to Create Invoice.",
        };
    }

    // note: why redirect outside because redirect is work in case error you can paste redirect inside of catch block
    // but why i'm putting here because make code readable only !!!!

    // note: revalidatePath is for make next-client re-fetch data from server
    // because next was store prev route and pre-fetch data for caching
    revalidatePath("/dashboard/invoices");
    redirect("/dashboard/invoices");
}

export async function updateInvoice(
    id: string,
    prevState: TErrorState,
    formData: FormData
) {
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get("customerId"),
        amount: formData.get("amount"),
        status: formData.get("status"),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing Fields. Failed to Update Invoice.",
        };
    }
    
    const {
        data: { amount, customerId, status },
    } = validatedFields;

    const amountInCents = amount * 100;

    try {
        await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
      `;
    } catch (error) {
        return { message: "Database Error: Failed to Update Invoice." };
    }

    revalidatePath("/dashboard/invoices");
    redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
    try {
        await sql`DELETE FROM invoices WHERE id = ${id}`;
        revalidatePath("/dashboard/invoices");
        return { message: "Deleted Invoice" };
    } catch (error) {
        return { message: "Database Error: Failed to Delete Invoice" };
    }
}


export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', Object.fromEntries(formData));
  } catch (error) {
    if ((error as Error).message.includes('CredentialsSignin')) {
      return 'CredentialSignin';
    }
    throw error;
  }
}