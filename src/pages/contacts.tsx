import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { useI18n } from "@/hooks/useI18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Plus,
  Upload,
  Download,
  Search,
  MoreVertical,
  Trash2,
  Edit,
  Tag,
  Folder,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Contact {
  id: string;
  name: string;
  phone: string;
  tags: string[] | null;
  group_id: string | null;
  group_name?: string;
  created_at: string;
  last_contacted: string | null;
}

interface ContactGroup {
  id: string;
  name: string;
  contact_count?: number;
}

export default function ContactsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("single");
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [pageSize, setPageSize] = useState(25);
  
  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [contactTags, setContactTags] = useState<string[]>([]);
  const [groupId, setGroupId] = useState<string>("");
  const [newGroupName, setNewGroupName] = useState("");
  
  // CSV Import states
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);

  useEffect(() => {
    fetchContacts();
    fetchGroups();
  }, [selectedGroup, selectedTag]);

  const fetchContacts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from("contacts")
      .select(`
        *,
        contact_groups (
          name
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(pageSize);

    if (selectedGroup !== "all") {
      query = query.eq("group_id", selectedGroup);
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch contacts",
        variant: "destructive",
      });
      return;
    }

    const formattedContacts = data?.map(contact => ({
      ...contact,
      group_name: contact.contact_groups?.name,
    })) || [];

    setContacts(formattedContacts);
    setLoading(false);
  };

  const fetchGroups = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("contact_groups")
      .select("*")
      .eq("user_id", user.id)
      .order("name");

    if (!error && data) {
      setGroups(data);
    }
  };

  const handleAddContact = async () => {
    if (!name.trim() || !phone.trim()) {
      toast({
        title: "Error",
        description: "Name and phone number are required",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("contacts").insert({
      user_id: user.id,
      name: name.trim(),
      phone: phone.trim(),
      tags: contactTags.length > 0 ? contactTags : null,
      group_id: groupId || null,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add contact",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Contact added successfully",
    });
    setName("");
    setPhone("");
    setContactTags([]);
    setGroupId("");
    setDialogOpen(false);
    fetchContacts();
  };

  const handleDeleteContact = async (id: string) => {
    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Contact deleted successfully",
    });
    fetchContacts();
  };

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("contact_groups").insert({
      user_id: user.id,
      name: newGroupName.trim(),
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Group created successfully",
    });
    setNewGroupName("");
    setGroupDialogOpen(false);
    fetchGroups();
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !contactTags.includes(tagInput.trim())) {
      setContactTags([...contactTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setContactTags(contactTags.filter(t => t !== tag));
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split("\n").map(row => row.split(","));
      setCsvPreview(rows.slice(0, 5));
    };
    reader.readAsText(file);
  };

  const handleCsvImport = async () => {
    if (!csvFile) {
      toast({
        title: "Error",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const rows = text.split("\n").slice(1);
      const contactsToInsert = rows
        .filter(row => row.trim())
        .map(row => {
          const [name, phone, tagsStr] = row.split(",");
          return {
            user_id: user.id,
            name: name?.trim(),
            phone: phone?.trim(),
            tags: tagsStr ? tagsStr.split(";").map(t => t.trim()) : null,
          };
        })
        .filter(c => c.name && c.phone);

      const { error } = await supabase
        .from("contacts")
        .insert(contactsToInsert);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to import contacts",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Imported ${contactsToInsert.length} contacts`,
      });
      setCsvFile(null);
      setCsvPreview([]);
      setDialogOpen(false);
      fetchContacts();
    };
    reader.readAsText(csvFile);
  };

  const handleExportCsv = () => {
    const csvContent = [
      ["Name", "Phone", "Tags", "Group", "Created At"],
      ...contacts.map(c => [
        c.name,
        c.phone,
        c.tags?.join(";") || "",
        c.group_name || "",
        new Date(c.created_at).toLocaleDateString(),
      ]),
    ]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Contacts exported successfully",
    });
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.phone.includes(searchQuery);
    const matchesTag = selectedTag === "all" || contact.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const allTags = Array.from(new Set(contacts.flatMap(c => c.tags || [])));

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-mono font-bold tracking-tight">{t("contacts")}</h1>
              <p className="text-muted-foreground mt-2">
                Manage your contact list, groups, and tags
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportCsv} className="font-mono">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="font-mono">
                    <Folder className="h-4 w-4 mr-2" />
                    New Group
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-mono">Create Contact Group</DialogTitle>
                    <DialogDescription>
                      Organize contacts into groups for easier management
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="group-name">Group Name</Label>
                      <Input
                        id="group-name"
                        placeholder="e.g., VIP Customers"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleAddGroup} className="w-full font-mono">
                      Create Group
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="font-mono">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-mono">Add Contact</DialogTitle>
                    <DialogDescription>
                      Add contacts individually or import from CSV
                    </DialogDescription>
                  </DialogHeader>

                  <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="single" className="font-mono">Single Contact</TabsTrigger>
                      <TabsTrigger value="import" className="font-mono">CSV Import</TabsTrigger>
                    </TabsList>

                    <TabsContent value="single" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          placeholder="Contact name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          placeholder="+62812XXXXXXXX"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="group">Group (Optional)</Label>
                        <Select value={groupId} onValueChange={setGroupId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a group" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">No Group</SelectItem>
                            {groups.map(group => (
                              <SelectItem key={group.id} value={group.id}>
                                {group.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tags">Tags (Optional)</Label>
                        <div className="flex gap-2">
                          <Input
                            id="tags"
                            placeholder="Add a tag"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                          />
                          <Button type="button" onClick={handleAddTag} variant="outline">
                            <Tag className="h-4 w-4" />
                          </Button>
                        </div>
                        {contactTags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {contactTags.map(tag => (
                              <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                                {tag} ×
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button onClick={handleAddContact} className="w-full font-mono">
                        Add Contact
                      </Button>
                    </TabsContent>

                    <TabsContent value="import" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="csv-file">CSV File</Label>
                        <Input
                          id="csv-file"
                          type="file"
                          accept=".csv"
                          onChange={handleCsvFileChange}
                        />
                        <p className="text-xs text-muted-foreground">
                          CSV format: Name, Phone, Tags (semicolon-separated)
                        </p>
                      </div>
                      {csvPreview.length > 0 && (
                        <div className="border rounded-lg p-4">
                          <p className="text-sm font-mono mb-2">Preview (first 5 rows):</p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <tbody>
                                {csvPreview.map((row, i) => (
                                  <tr key={i} className={i === 0 ? "font-semibold" : ""}>
                                    {row.map((cell, j) => (
                                      <td key={j} className="border px-2 py-1">
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      <Button onClick={handleCsvImport} className="w-full font-mono" disabled={!csvFile}>
                        <Upload className="h-4 w-4 mr-2" />
                        Import Contacts
                      </Button>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 font-mono"
                    />
                  </div>
                </div>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger className="w-[200px] font-mono">
                    <SelectValue placeholder="All Groups" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {groups.map(group => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedTag} onValueChange={setSelectedTag}>
                  <SelectTrigger className="w-[200px] font-mono">
                    <SelectValue placeholder="All Tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    {allTags.map(tag => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger className="w-[120px] font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 / page</SelectItem>
                    <SelectItem value="50">50 / page</SelectItem>
                    <SelectItem value="100">100 / page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Contacts Table */}
          <Card>
            <CardHeader>
              <CardTitle className="font-mono">
                {filteredContacts.length} Contact{filteredContacts.length !== 1 ? "s" : ""}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center text-muted-foreground font-mono py-8">Loading contacts...</div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="font-mono text-muted-foreground">No contacts found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Add your first contact or import from CSV
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-mono">Name</TableHead>
                        <TableHead className="font-mono">Phone</TableHead>
                        <TableHead className="font-mono">Group</TableHead>
                        <TableHead className="font-mono">Tags</TableHead>
                        <TableHead className="font-mono">Created</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContacts.map((contact) => (
                        <TableRow key={contact.id}>
                          <TableCell className="font-mono font-medium">{contact.name}</TableCell>
                          <TableCell className="font-mono text-muted-foreground">{contact.phone}</TableCell>
                          <TableCell>
                            {contact.group_name && (
                              <Badge variant="outline" className="font-mono">
                                <Folder className="h-3 w-3 mr-1" />
                                {contact.group_name}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {contact.tags?.map(tag => (
                                <Badge key={tag} variant="secondary" className="font-mono text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {new Date(contact.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteContact(contact.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}