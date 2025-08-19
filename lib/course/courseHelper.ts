export function getCourseProps(course: any, purchasedCourseIds: any[]) {
  const isPurchased = purchasedCourseIds.some(id => 
    parseInt(id.toString()) === parseInt(course.id.toString())
  );
  const isFree = course.price === 0;
  const hasAccess = isFree || isPurchased;
  const needsPurchase = !hasAccess && course.price > 0;

  return {
    isPurchased,
    isFree,
    hasAccess,
    needsPurchase
  };
}