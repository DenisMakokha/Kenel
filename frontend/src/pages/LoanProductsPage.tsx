import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loanProductService } from '../services/loanProductService';
import { LoanProduct, ProductType, QueryProductsDto } from '../types/loan-product';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

export default function LoanProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [productType, setProductType] = useState<ProductType | ''>('');
  const [isActive, setIsActive] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<LoanProduct | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [page, productType, isActive]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params: QueryProductsDto = {
        page,
        limit: 20,
      };

      if (search) params.search = search;
      if (productType) params.productType = productType;
      if (isActive) params.isActive = isActive;

      const response = await loanProductService.getProducts(params);
      setProducts(response.data);
      setTotalPages(response.meta.totalPages);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  const getProductTypeBadge = (type: ProductType) => {
    const variants: Record<ProductType, any> = {
      SALARY_ADVANCE: 'default',
      TERM_LOAN: 'secondary',
      BUSINESS_LOAN: 'outline',
      CUSTOM: 'outline',
    };

    const labels: Record<ProductType, string> = {
      SALARY_ADVANCE: 'Salary Advance',
      TERM_LOAN: 'Term Loan',
      BUSINESS_LOAN: 'Business Loan',
      CUSTOM: 'Custom',
    };

    return <Badge variant={variants[type]}>{labels[type]}</Badge>;
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="success">Active</Badge>
    ) : (
      <Badge variant="destructive">Inactive</Badge>
    );
  };

  const handleDeleteClick = (product: LoanProduct) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      setDeleting(true);
      await loanProductService.deleteProduct(productToDelete.id);
      toast.success('Product deleted successfully');
      loadProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Loan Products</h1>
          <p className="text-muted-foreground">Manage loan product definitions and versions</p>
        </div>
        <Button onClick={() => navigate('/loan-products/new')}>+ New Product</Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="h-10 px-3 rounded-md border border-input bg-background"
              value={productType}
              onChange={(e) => {
                setProductType(e.target.value as ProductType | '');
                setPage(1);
              }}
            >
              <option value="">All Types</option>
              <option value="SALARY_ADVANCE">Salary Advance</option>
              <option value="TERM_LOAN">Term Loan</option>
              <option value="BUSINESS_LOAN">Business Loan</option>
              <option value="CUSTOM">Custom</option>
            </select>
            <select
              className="h-10 px-3 rounded-md border border-input bg-background"
              value={isActive}
              onChange={(e) => {
                setIsActive(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Products Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No loan products found</p>
              <Button onClick={() => navigate('/loan-products/new')}>Create Your First Product</Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Published Version</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono">{product.code}</TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{getProductTypeBadge(product.productType)}</TableCell>
                      <TableCell>{product.currencyCode}</TableCell>
                      <TableCell>{getStatusBadge(product.isActive)}</TableCell>
                      <TableCell>
                        {product.versions && product.versions.length > 0 ? (
                          <span className="text-sm">v{product.versions[0].versionNumber}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">No published version</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/loan-products/${product.id}`)}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/loan-products/${product.id}/edit`)}
                          >
                            Edit
                          </Button>
                          {!product.isActive && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteClick(product)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Loan Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
