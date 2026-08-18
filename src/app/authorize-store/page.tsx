"use client";

import React, { useEffect, useCallback, useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const AuthorizeStorePage: React.FC = () => {
  const [storeName, setStoreName] = useState("");
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("status") === "fail") {
      setShowError(true);
    }
    const store = params.get("storeName");
    if (store) {
      setStoreName(store);
    }
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setStoreName(e.target.value);
      if (showError) setShowError(false);
    },
    [showError]
  );

  return (
    <main className="min-h-[100vh] flex flex-col items-center justify-center p-6">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <div className="flex items-center justify-center">
          <Image src="/logo.svg" alt="ikas Logo" width={192} height={48} priority className="h-auto w-[12rem] object-contain" />
        </div>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Connect your ikas store</CardTitle>
            <CardDescription>Enter your store name to authorize this app.</CardDescription>
          </CardHeader>
          <form method="GET" action="/api/oauth/authorize/ikas" autoComplete="off">
            <CardContent className="space-y-2">
              <Label htmlFor="storeName">Store name</Label>
              <Input
                id="storeName"
                name="storeName"
                value={storeName}
                onChange={handleInputChange}
                required
                autoFocus
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="none"
                aria-invalid={showError || undefined}
              />
              {showError && (
                <p className="text-sm text-destructive">An error occurred. Please try again.</p>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={!storeName.trim()} className="w-full">
                Add to My Store
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
};

export default AuthorizeStorePage;