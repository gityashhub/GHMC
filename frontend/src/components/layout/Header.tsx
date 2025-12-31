import { Bell, Search, Calendar, LogOut, User, Menu } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import { useState } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-card/50 backdrop-blur-xl border-b border-border px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Mobile Menu */}
        <div className="lg:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="w-6 h-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-r-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">Access all sections of the ERP system</SheetDescription>
              <Sidebar onItemClick={() => setIsMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>

        <div>
          <h1 className="text-lg md:text-2xl font-bold text-foreground truncate max-w-[150px] md:max-w-none">{title}</h1>
          {subtitle && <p className="text-xs md:text-sm text-muted-foreground mt-0.5 truncate max-w-[150px] md:max-w-none">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Search - Hidden on mobile */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="input-field pl-10 w-48 lg:w-64"
          />
        </div>

        {/* Date - Hidden on mobile */}
        <div className="hidden sm:flex items-center gap-2 text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">{format(new Date(), "dd MMM yyyy")}</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        </button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.fullName || 'Admin'}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
