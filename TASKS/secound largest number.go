package main
import (
"fmt"
"math"
)
func main() {
var n int
fmt.Print("Enter the no: of elements pls ")
fmt.Scan(&n)
 if n < 2 {
fmt.Println("there should contain atleast two elements")
return
}
arr := make([]int, n)
fmt.Println("pls enter the element")
for i:=0; i<n;i++ {
fmt.Scan(&arr[i])
}
first:= math.MinInt64
second:= math.MinInt64
for i:=0;i <n;i++ {
if arr[i] > first {
second = first
first = arr[i]
} else if arr[i]>second && arr[i]!=first {
second = arr[i]
}
}
if second == math.MinInt64 {
fmt.Println("There is no second largest element")
} else {
fmt.Println("the second largest no: is ", second)
}
}