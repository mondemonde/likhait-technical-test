class Category < ApplicationRecord
  has_many :expenses, dependent: :destroy

  validates :name, presence: true, uniqueness: { case_sensitive: false }, length: { maximum: 100 }

  before_validation :strip_name

  private

  def strip_name
    self.name = name&.strip
  end
end
