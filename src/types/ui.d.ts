// Type declarations for UI components
declare module '@/components/ui/table' {
  import { ForwardRefExoticComponent, RefAttributes, HTMLAttributes } from 'react';
  
  export const Table: ForwardRefExoticComponent<HTMLAttributes<HTMLTableElement> & RefAttributes<HTMLTableElement>>;
  export const TableHeader: ForwardRefExoticComponent<HTMLAttributes<HTMLTableSectionElement> & RefAttributes<HTMLTableSectionElement>>;
  export const TableBody: ForwardRefExoticComponent<HTMLAttributes<HTMLTableSectionElement> & RefAttributes<HTMLTableSectionElement>>;
  export const TableFooter: ForwardRefExoticComponent<HTMLAttributes<HTMLTableSectionElement> & RefAttributes<HTMLTableSectionElement>>;
  export const TableHead: ForwardRefExoticComponent<HTMLAttributes<HTMLTableCellElement> & RefAttributes<HTMLTableCellElement>>;
  export const TableRow: ForwardRefExoticComponent<HTMLAttributes<HTMLTableRowElement> & RefAttributes<HTMLTableRowElement>>;
  export const TableCell: ForwardRefExoticComponent<HTMLAttributes<HTMLTableCellElement> & RefAttributes<HTMLTableCellElement>>;
  export const TableCaption: ForwardRefExoticComponent<HTMLAttributes<HTMLTableCaptionElement> & RefAttributes<HTMLTableCaptionElement>>;
}

declare module '@/components/ui/card' {
  import { ForwardRefExoticComponent, RefAttributes, HTMLAttributes } from 'react';
  
  export const Card: ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>>;
  export const CardHeader: ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>>;
  export const CardFooter: ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>>;
  export const CardTitle: ForwardRefExoticComponent<HTMLAttributes<HTMLHeadingElement> & RefAttributes<HTMLHeadingElement>>;
  export const CardDescription: ForwardRefExoticComponent<HTMLAttributes<HTMLParagraphElement> & RefAttributes<HTMLParagraphElement>>;
  export const CardContent: ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>>;
}

declare module '@/components/ui/dialog' {
  import { ForwardRefExoticComponent, RefAttributes, HTMLAttributes, ReactNode } from 'react';
  
  export interface DialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: ReactNode;
  }
  
  export const Dialog: React.FC<DialogProps>;
  export const DialogTrigger: ForwardRefExoticComponent<HTMLAttributes<HTMLButtonElement> & { asChild?: boolean } & RefAttributes<HTMLButtonElement>>;
  export const DialogContent: React.FC<HTMLAttributes<HTMLDivElement>>;
  export const DialogHeader: ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>>;
  export const DialogFooter: ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>>;
  export const DialogTitle: ForwardRefExoticComponent<HTMLAttributes<HTMLHeadingElement> & RefAttributes<HTMLHeadingElement>>;
  export const DialogDescription: ForwardRefExoticComponent<HTMLAttributes<HTMLParagraphElement> & RefAttributes<HTMLParagraphElement>>;
}

declare module '@/components/ui/input' {
  import { ForwardRefExoticComponent, RefAttributes, InputHTMLAttributes } from 'react';
  
  export const Input: ForwardRefExoticComponent<InputHTMLAttributes<HTMLInputElement> & RefAttributes<HTMLInputElement>>;
}

declare module '@/components/ui/label' {
  import { ForwardRefExoticComponent, RefAttributes, LabelHTMLAttributes } from 'react';
  
  export const Label: ForwardRefExoticComponent<LabelHTMLAttributes<HTMLLabelElement> & RefAttributes<HTMLLabelElement>>;
}

declare module '@/components/ui/select' {
  import { ForwardRefExoticComponent, RefAttributes, HTMLAttributes, ReactNode } from 'react';
  
  export interface SelectProps {
    value?: string;
    onValueChange?: (value: string) => void;
    defaultValue?: string;
    children?: ReactNode;
  }
  
  export const Select: React.FC<SelectProps>;
  export const SelectTrigger: ForwardRefExoticComponent<HTMLAttributes<HTMLButtonElement> & RefAttributes<HTMLButtonElement>>;
  export const SelectValue: React.FC<HTMLAttributes<HTMLSpanElement> & { placeholder?: string }>;
  export const SelectContent: React.FC<HTMLAttributes<HTMLDivElement>>;
  export const SelectItem: ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement> & { value: string } & RefAttributes<HTMLDivElement>>;
}

declare module '@/components/ui/tabs' {
  import { ForwardRefExoticComponent, RefAttributes, HTMLAttributes, ReactNode } from 'react';
  
  export interface TabsProps {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    children?: ReactNode;
  }
  
  export const Tabs: React.FC<TabsProps>;
  export const TabsList: ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>>;
  export const TabsTrigger: ForwardRefExoticComponent<HTMLAttributes<HTMLButtonElement> & { value: string } & RefAttributes<HTMLButtonElement>>;
  export const TabsContent: ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement> & { value: string } & RefAttributes<HTMLDivElement>>;
}
